import React, { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera as CameraIcon, Image, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CameraCaptureProps {
  onImageCapture?: (imageUrl: string) => void;
  title?: string;
}

export function CameraCapture({ onImageCapture, title = "Document Scanner" }: CameraCaptureProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const { toast } = useToast();

  const takePicture = async () => {
    try {
      setIsCapturing(true);
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      if (image.dataUrl) {
        setCapturedImage(image.dataUrl);
        onImageCapture?.(image.dataUrl);
        toast({
          title: "Image captured successfully",
          description: "Ready for processing"
        });
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      toast({
        title: "Camera Error",
        description: "Failed to capture image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const selectFromGallery = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos
      });

      if (image.dataUrl) {
        setCapturedImage(image.dataUrl);
        onImageCapture?.(image.dataUrl);
        toast({
          title: "Image selected successfully",
          description: "Ready for processing"
        });
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      toast({
        title: "Gallery Error",
        description: "Failed to select image. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={takePicture} 
            disabled={isCapturing}
            className="flex items-center gap-2"
          >
            <CameraIcon className="h-4 w-4" />
            {isCapturing ? "Capturing..." : "Take Photo"}
          </Button>
          
          <Button 
            onClick={selectFromGallery}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Image className="h-4 w-4" />
            From Gallery
          </Button>
        </div>

        {capturedImage && (
          <div className="mt-4">
            <img 
              src={capturedImage} 
              alt="Captured" 
              className="w-full h-48 object-cover rounded-lg border"
            />
            <Button 
              onClick={() => setCapturedImage(null)}
              variant="outline"
              size="sm"
              className="mt-2 w-full"
            >
              Clear Image
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}