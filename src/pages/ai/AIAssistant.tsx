import { Bot, Send } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function AIAssistant() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Assistant"
        description="Intelligent inventory and CRM insights powered by AI"
      />
      <Card className="h-[calc(100vh-280px)] flex flex-col">
        <CardContent className="flex-1 flex flex-col p-6">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">AI Assistant</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Ask questions about your inventory, get demand forecasts, analyze customer behavior,
                or optimize stock levels.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-4 border-t border-border">
            <Input placeholder="Ask anything about your business..." className="flex-1" />
            <Button size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
