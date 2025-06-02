
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Plus, Calendar as CalendarIcon } from 'lucide-react';

interface QuickActionsProps {
  onCaptionsClick: () => void;
  onScheduleClick: () => void;
}

const QuickActions = ({ onCaptionsClick, onScheduleClick }: QuickActionsProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-vibrant-purple" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            onClick={() => navigate('/upload')}
            className="h-20 bg-gradient-primary hover:opacity-90 flex flex-col gap-2"
          >
            <Plus className="h-6 w-6" />
            Start & add products
          </Button>
          <Button 
            variant="outline"
            className="h-20 flex flex-col gap-2"
            onClick={onCaptionsClick}
          >
            <MessageSquare className="h-6 w-6" />
            View Captions
          </Button>
          <Button 
            variant="outline"
            className="h-20 flex flex-col gap-2"
            onClick={onScheduleClick}
          >
            <CalendarIcon className="h-6 w-6" />
            Schedule Post
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
