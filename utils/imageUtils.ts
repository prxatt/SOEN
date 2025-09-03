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

            // Prepare watermark text
            const line1 = 'PRAXIS AI';
            const line2 = 'by Surface Tension';
            const fontSize = Math.max(12, Math.min(img.width * 0.02, img.height * 0.03));
            ctx.font = `bold ${fontSize}px "Instrument Sans", sans-serif`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.textAlign = 'right';
            
            const margin = fontSize;
            const x = canvas.width - margin;
            const y2 = canvas.height - margin;
            const y1 = y2 - (fontSize * 1.2);
            
            // Add a subtle shadow for better readability
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 5;

            // Draw text
            ctx.fillText(line1, x, y1);
            ctx.fillText(line2, x, y2);

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
