import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera } from 'lucide-react';

export default function CameraView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    async function getCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        setError('Unable to access webcam: ' + (err?.message || 'Unknown error'));
      }
    }
    getCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Camera className="h-6 w-6" />
          <span>Live Camera Feed</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center p-0">
        <div className="aspect-video w-full bg-muted rounded-b-lg overflow-hidden flex items-center justify-center">
          {error ? (
            <span className="text-red-500 p-4">{error}</span>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              width={640}
              height={480}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
