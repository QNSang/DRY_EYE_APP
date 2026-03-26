/**
 * Face Mesh Drawer
 * Visualizes the 478 MediaPipe Face Landmarks on a Canvas
 */

import { FaceLandmarker } from '@mediapipe/tasks-vision';
import { NormalizedLandmark } from '../../types/camera';

export class FaceMeshDrawer {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;

    // Cache connections to avoid constant lookup
    private connections: any[] = [];

    constructor() {
        // Try to get connections from static property
        try {
            // @ts-ignore - Accessing static property that exists in lib
            this.connections = FaceLandmarker.FACE_LANDMARKS_TESSELATION;
            console.log('[FaceMeshDrawer] Loaded tesselation connections:', this.connections?.length);
        } catch (e) {
            console.warn('[FaceMeshDrawer] Tesselation constants not found, falling back to points only.');
        }
    }

    setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    /**
     * Draw landmarks on the canvas
     */
    draw(landmarks: NormalizedLandmark[]) {
        if (!this.canvas || !this.ctx || !landmarks) return;

        // Clear previous frame
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Styling
        this.ctx.strokeStyle = '#00FF00'; // Cyber Green
        this.ctx.lineWidth = 0.5;
        this.ctx.fillStyle = '#00FF00';

        const width = this.canvas.width;
        const height = this.canvas.height;

        // 1. Draw Connections (Mesh)
        if (this.connections && this.connections.length > 0) {
            this.ctx.beginPath();
            for (const conn of this.connections) {
                const start = landmarks[conn.start];
                const end = landmarks[conn.end];
                if (start && end) {
                    this.ctx.moveTo(start.x * width, start.y * height);
                    this.ctx.lineTo(end.x * width, end.y * height);
                }
            }
            this.ctx.stroke();
        } else {
            // Fallback: Draw all points as tiny dots if connections fail
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
            for (const p of landmarks) {
                this.ctx.fillRect(p.x * width, p.y * height, 1, 1);
            }
        }

        // 2. Draw Points (Optional, maybe just key points?)
        // Drawing 478 points is heavy, let's just draw the mesh.
        // Or maybe draw iris points clearly?
        // Iris indices: Left: 468-472, Right: 473-477

        this.ctx.fillStyle = '#FFEB3B'; // Bright Yellow Iris
        // Left Iris
        for (let i = 468; i <= 472; i++) {
            const p = landmarks[i];
            if (p) {
                this.ctx.beginPath();
                this.ctx.arc(p.x * width, p.y * height, 2.5, 0, 2 * Math.PI);
                this.ctx.fill();
            }
        }
        // Right Iris
        for (let i = 473; i <= 477; i++) {
            const p = landmarks[i];
            if (p) {
                this.ctx.beginPath();
                this.ctx.arc(p.x * width, p.y * height, 2.5, 0, 2 * Math.PI);
                this.ctx.fill();
            }
        }

        // 3. Highlight eye contours for EAR debugging
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 1;
        const leftIndices = [33, 160, 158, 133, 153, 144];
        const rightIndices = [362, 385, 387, 263, 373, 380];

        const drawContour = (indices: number[]) => {
            this.ctx?.beginPath();
            indices.forEach((idx, i) => {
                const p = landmarks[idx];
                if (!p) return;
                if (i === 0) this.ctx?.moveTo(p.x * width, p.y * height);
                else this.ctx?.lineTo(p.x * width, p.y * height);
            });
            this.ctx?.closePath();
            this.ctx?.stroke();
        };

        drawContour(leftIndices);
        drawContour(rightIndices);
    }

    reset() {
        if (this.canvas && this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}
