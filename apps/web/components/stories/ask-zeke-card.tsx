/**
 * Ask ZEKE Card component
 * Interactive card for asking questions and viewing story summaries
 */

import { Badge } from '@zeke/design-system/components/ui/badge';
import { Button } from '@zeke/design-system/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@zeke/design-system/components/ui/card';
import { Input } from '@zeke/design-system/components/ui/input';
import { askZekeQuestions } from '../../lib/stories-utils';

export function AskZekeCard() {
  const timeframes = ['Last Day', 'Last Week', 'Last Month'];
  const summaryPoints = [
    'Open‑source model adoption accelerates; pricing pressure rises.',
    'Claude update sparks enterprise interest; eval focus grows.',
    'Benchmarks shift toward task‑level outcomes.',
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Ask ZEKE</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* View Story Summary section */}
        <div className="space-y-3">
          <div className="text-muted-foreground text-xs uppercase tracking-wide">
            View Story Summary
          </div>
          
          {/* Time frame selector */}
          <div className="flex flex-wrap gap-2">
            {timeframes.map((timeframe, i) => (
              <Badge
                key={timeframe}
                variant={i === 0 ? "default" : "secondary"}
                className="cursor-pointer text-xs"
              >
                {timeframe}
              </Badge>
            ))}
          </div>
          
          {/* Summary points */}
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
            {summaryPoints.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </div>
        
        {/* Separator */}
        <div className="h-px bg-border" />
        
        {/* Quick questions */}
        <div className="space-y-2">
          {askZekeQuestions.map((question) => (
            <Button
              key={question}
              variant="outline"
              size="sm"
              className="w-full justify-start text-left text-sm h-auto py-2 px-3"
            >
              {question}
            </Button>
          ))}
        </div>
        
        {/* Question input */}
        <Input
          placeholder="Ask a question"
          className="text-sm"
        />
      </CardContent>
    </Card>
  );
}
