export const applyWatermark = (base64Image: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Image;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(base64Image); // Return original if canvas context is not available
                return;
            }

            // Draw the original image
            ctx.drawImage(img, 0, 0);
            const fontSize = Math.max(12, Math.min(img.width * 0.02, img.height * 0.03));
            const margin = fontSize;

            // Add a subtle shadow for better readability
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 5;

            // --- Add Date (Bottom Left) ---
            const dateStr = new Date().toLocaleDateString('en-US', { year: '2-digit', month: '2-digit', day: '2-digit' }).replace(/\//g, ' ');
            ctx.font = `bold ${fontSize * 0.8}px monospace`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.textAlign = 'left';
            ctx.fillText(dateStr, margin, canvas.height - margin);

            // --- Add Watermark Text (Bottom Right) ---
            const watermarkText = 'PRAXIS AI by Surface Tension';
            ctx.font = `bold ${fontSize * 0.9}px "Instrument Sans", sans-serif`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.textAlign = 'right';
            const x = canvas.width - margin;
            const y = canvas.height - margin;
            ctx.fillText(watermarkText, x, y);

            // Reset shadow
            ctx.shadowBlur = 0;

            resolve(canvas.toDataURL('image/jpeg'));
        };
        img.onerror = () => {
            // If image fails to load, return the original (potentially broken) base64 string
            resolve(base64Image);
        };
    });
};