'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Save, Send, Code, FileText } from 'lucide-react';
import type { Prompt, PromptVersion } from '@/lib/methodology';

interface PromptEditorProps {
  prompt: Prompt;
  version: PromptVersion;
  onSave?: (version: Partial<PromptVersion>) => void;
  onSubmitForReview?: (versionId: string) => void;
  readOnly?: boolean;
}

export function PromptEditor({
  prompt,
  version,
  onSave,
  onSubmitForReview,
  readOnly = false,
}: PromptEditorProps) {
  const [editedVersion, setEditedVersion] = useState<Partial<PromptVersion>>({
    template: version.template,
    system_prompt: version.system_prompt,
    template_format: version.template_format,
    model_config: version.model_config,
  });
  const [activeTab, setActiveTab] = useState('template');
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'pending_review':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending Review</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  
  const handleSave = () => {
    if (onSave) {
      onSave(editedVersion);
    }
  };
  
  const handleSubmit = () => {
    if (onSubmitForReview && version.status === 'draft') {
      onSubmitForReview(version.id);
    }
  };
  
  const formatModelConfig = () => {
    try {
      return JSON.stringify(editedVersion.model_config || {}, null, 2);
    } catch {
      return '{}';
    }
  };
  
  const updateModelConfig = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      setEditedVersion({ ...editedVersion, model_config: parsed });
    } catch {
      // Invalid JSON, ignore
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>{prompt.name}</CardTitle>
              {getStatusBadge(version.status)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {prompt.description}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <code className="text-xs bg-muted px-2 py-0.5 rounded">{prompt.key}</code>
              <Badge variant="outline" className="text-xs">
                v{version.version}
              </Badge>
            </div>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              {version.status === 'draft' && onSubmitForReview && (
                <Button size="sm" onClick={handleSubmit}>
                  <Send className="h-4 w-4 mr-2" />
                  Submit for Review
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="template">
              <FileText className="h-4 w-4 mr-2" />
              Template
            </TabsTrigger>
            <TabsTrigger value="system">
              <Code className="h-4 w-4 mr-2" />
              System Prompt
            </TabsTrigger>
            <TabsTrigger value="config">
              <Code className="h-4 w-4 mr-2" />
              Model Config
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="template" className="space-y-4">
            <div className="space-y-2">
              <Label>Template Format</Label>
              <Select
                value={editedVersion.template_format}
                onValueChange={(value: any) => 
                  setEditedVersion({ ...editedVersion, template_format: value })
                }
                disabled={readOnly}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="handlebars">Handlebars</SelectItem>
                  <SelectItem value="jinja2">Jinja2</SelectItem>
                  <SelectItem value="plain">Plain Text</SelectItem>
                  <SelectItem value="markdown">Markdown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              value={editedVersion.template}
              onChange={(e) => setEditedVersion({ ...editedVersion, template: e.target.value })}
              disabled={readOnly}
              className="font-mono min-h-[400px]"
              placeholder="Enter prompt template here..."
            />
          </TabsContent>
          
          <TabsContent value="system">
            <Textarea
              value={editedVersion.system_prompt || ''}
              onChange={(e) => setEditedVersion({ ...editedVersion, system_prompt: e.target.value })}
              disabled={readOnly}
              className="font-mono min-h-[400px]"
              placeholder="Enter system prompt here (optional)..."
            />
          </TabsContent>
          
          <TabsContent value="config">
            <Textarea
              value={formatModelConfig()}
              onChange={(e) => updateModelConfig(e.target.value)}
              disabled={readOnly}
              className="font-mono min-h-[400px]"
              placeholder='{"temperature": 0.3, "max_tokens": 2000}'
            />
          </TabsContent>
          
          <TabsContent value="preview">
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Template Preview</h4>
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {editedVersion.template}
                </pre>
              </div>
              
              {editedVersion.system_prompt && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">System Prompt</h4>
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {editedVersion.system_prompt}
                  </pre>
                </div>
              )}
              
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Expected Inputs</h4>
                <ul className="text-sm list-disc list-inside">
                  {prompt.expected_inputs?.map((input) => (
                    <li key={input}>{input}</li>
                  )) || <li className="text-muted-foreground">No inputs defined</li>}
                </ul>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Expected Outputs</h4>
                <ul className="text-sm list-disc list-inside">
                  {prompt.expected_outputs?.map((output) => (
                    <li key={output}>{output}</li>
                  )) || <li className="text-muted-foreground">No outputs defined</li>}
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
