// tools/gen-icons.js
import fs from "fs";
import path from "path";
import sharp from "sharp";
import toIco from "to-ico";
import { execSync } from "child_process";

const ROOT = process.cwd();
const inSvg = path.resolve(ROOT, "resources/icons/pen.svg");
const outDir = path.resolve(ROOT, "resources/icons");
const sizes = [16, 32, 48, 128, 256, 512, 1024];

async function run() {
	if (!fs.existsSync(inSvg)) {
		console.error("❌ Missing input SVG:", inSvg);
		process.exit(1);
	}
	await fs.promises.mkdir(outDir, { recursive: true });

	// 1) Generate PNGs at all sizes
	const pngPaths = [];
	for (const s of sizes) {
		const outPng = path.join(outDir, `icon-${s}x${s}.png`);
		await sharp(inSvg).resize(s, s).png().toFile(outPng);
		pngPaths.push(outPng);
	}
	console.log("✅ PNGs:", pngPaths.map(p => path.basename(p)).join(", "));

	// 2) App splash/about PNG (512x512)
	const splashSrc = path.join(outDir, "icon-512x512.png");
	const splashOut = path.join(outDir, "publisherstudio-logo.png");
	await fs.promises.copyFile(splashSrc, splashOut);

	// 3) Windows ICO
	const icoSizes = [16, 32, 48, 256];
	const icoBuffers = icoSizes.map(s =>
		fs.readFileSync(path.join(outDir, `icon-${s}x${s}.png`))
	);
	const icoBuf = await toIco(icoBuffers);
	if (!icoBuf || !icoBuf.length) {
		console.error("❌ ICO generation failed");
		process.exit(1);
	}
	fs.writeFileSync(path.join(outDir, "publisherstudio-icon.ico"), icoBuf);

	// 4) macOS ICNS via iconutil (macOS only)
	const iconsetDir = path.join(outDir, "publisherstudio.iconset");
	await fs.promises.mkdir(iconsetDir, { recursive: true });

	for (const s of [16, 32, 64, 128, 256, 512]) {
		const src = path.join(outDir, `icon-${s}x${s}.png`);
		if (fs.existsSync(src)) {
			const dst = path.join(iconsetDir, `icon_${s}x${s}.png`);
			await fs.promises.copyFile(src, dst);
			// also generate @2x sizes
			const dst2x = path.join(iconsetDir, `icon_${s}x${s}@2x.png`);
			await sharp(src).resize(s * 2, s * 2).toFile(dst2x);
		}
	}

	try {
		execSync(
			`iconutil -c icns "${iconsetDir}" -o "${path.join(
				outDir,
				"publisherstudio-icon.icns"
			)}"`
		);
		console.log("✅ ICNS generated via iconutil");
	} catch (e) {
		console.error("❌ ICNS generation failed:", e.message);
	}

	// 5) Copy master SVG
	await fs.promises.copyFile(inSvg, path.join(outDir, "publisherstudio-icon.svg"));

	// 6) Cleanup intermediate PNGs + iconset
	for (const p of pngPaths) {
		await fs.promises.unlink(p).catch(() => { });
	}
	await fs.promises.rm(iconsetDir, { recursive: true, force: true });

	console.log("🎉 Done. Final assets in resources/icons/:");
	console.log(" - publisherstudio-logo.png");
	console.log(" - publisherstudio-icon.ico");
	console.log(" - publisherstudio-icon.icns");
	console.log(" - publisherstudio-icon.svg");
}

run().catch(err => {
	console.error("❌ Script failed:", err);
	process.exit(1);
});
