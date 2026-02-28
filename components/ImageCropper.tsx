
import React, { useState, useRef, useEffect, FC } from 'react';

interface ImageCropperProps {
  imageSrc: string;
  onCancel: () => void;
  onCropComplete: (croppedImage: string) => void;
}

const ImageCropper: FC<ImageCropperProps> = ({ imageSrc, onCancel, onCropComplete }) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(new Image());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    imageRef.current.src = imageSrc;
    imageRef.current.onload = () => {
      draw();
    };
  }, [imageSrc]);

  useEffect(() => {
    draw();
  }, [zoom, pan]);

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imageRef.current;
    
    if (canvas && ctx && img) {
      const size = 300; // Crop box size
      canvas.width = size;
      canvas.height = size;
      
      ctx.clearRect(0, 0, size, size);
      
      // Calculate scaling to fit image initially then apply zoom
      const scale = Math.max(size / img.width, size / img.height) * zoom;
      
      const centerX = size / 2;
      const centerY = size / 2;
      
      ctx.save();
      ctx.translate(centerX + pan.x, centerY + pan.y);
      ctx.scale(scale, scale);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
    }
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragStart({ x: clientX - pan.x, y: clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault(); // Prevent scrolling on touch
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setPan({ x: clientX - dragStart.x, y: clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
      onCropComplete(dataUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-smart-fade-in">
      <h3 className="text-white font-black text-lg uppercase tracking-widest mb-8 drop-shadow-md">Adjust Photo</h3>
      
      <div 
        ref={containerRef}
        className="relative w-[300px] h-[300px] overflow-hidden rounded-full border-[6px] border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-black cursor-move touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />
        
        {/* Grid Overlay for easier centering */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute top-1/3 left-0 right-0 h-px bg-white"></div>
            <div className="absolute top-2/3 left-0 right-0 h-px bg-white"></div>
            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white"></div>
            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white"></div>
        </div>
      </div>

      <div className="w-[280px] mt-10 space-y-4">
        <div className="flex justify-between items-center px-1">
            <span className="text-[10px] text-white/50 font-black uppercase tracking-tighter">Zoom Out</span>
            <span className="text-[10px] text-white/50 font-black uppercase tracking-tighter">Zoom In</span>
        </div>
        <input 
          type="range" 
          min="1" 
          max="3" 
          step="0.01" 
          value={zoom} 
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          className="w-full accent-primary h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="flex gap-4 mt-12 w-full max-w-[320px]">
        <button 
          onClick={onCancel}
          className="flex-1 py-4 bg-white/5 text-white/70 font-black rounded-2xl border border-white/10 active:scale-95 transition-all text-xs uppercase tracking-widest"
        >
          Cancel
        </button>
        <button 
          onClick={handleSave}
          className="flex-1 py-4 bg-gradient-to-r from-primary to-secondary text-white font-black rounded-2xl shadow-2xl shadow-primary/30 active:scale-95 transition-all text-xs uppercase tracking-widest"
        >
          Save Photo
        </button>
      </div>
    </div>
  );
};

export default ImageCropper;
