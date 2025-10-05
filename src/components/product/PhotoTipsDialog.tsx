import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Lightbulb, Eye, Zap, CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface PhotoTipsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const PhotoTipsDialog: React.FC<PhotoTipsDialogProps> = ({
  open,
  onOpenChange,
  onConfirm
}) => {
  const { t } = useLanguage();

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const tips = [
    {
      icon: <Lightbulb className="w-5 h-5 text-yellow-500" />,
      title: t('photoTips.lighting.title'),
      description: t('photoTips.lighting.description')
    },
    {
      icon: <Eye className="w-5 h-5 text-blue-500" />,
      title: t('photoTips.background.title'),
      description: t('photoTips.background.description')
    },
    {
      icon: <Camera className="w-5 h-5 text-green-500" />,
      title: t('photoTips.angle.title'),
      description: t('photoTips.angle.description')
    },
    {
      icon: <Zap className="w-5 h-5 text-purple-500" />,
      title: t('photoTips.quality.title'),
      description: t('photoTips.quality.description')
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-6 h-6 text-primary" />
            {t('photoTips.title')}
          </DialogTitle>
          <DialogDescription>
            {t('photoTips.description')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {tips.map((tip, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex-shrink-0 mt-0.5">
                {tip.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-1">{tip.title}</h4>
                <p className="text-sm text-muted-foreground">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-300">
            {t('photoTips.result')}
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleConfirm} className="bg-primary hover:bg-primary/90">
            {t('photoTips.enableEnhancement')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
