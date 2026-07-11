'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Plus, CheckCircle, Clock, Archive } from 'lucide-react';
import type { MethodologyVersion } from '@/lib/methodology';

interface VersionManagerProps {
  versions: MethodologyVersion[];
  onCreateVersion?: (version: Partial<MethodologyVersion>) => void;
  onActivateVersion?: (versionId: string) => void;
  onRetireVersion?: (versionId: string) => void;
}

export function VersionManager({
  versions,
  onCreateVersion,
  onActivateVersion,
  onRetireVersion,
}: VersionManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newVersion, setNewVersion] = useState<Partial<MethodologyVersion>>({
    status: 'draft',
  });
  
  const sortedVersions = [...versions].sort(
    (a, b) => new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime()
  );
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Active</Badge>;
      case 'draft':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Draft</Badge>;
      case 'retired':
        return <Badge variant="outline"><Archive className="h-3 w-3 mr-1" /> Retired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  
  const handleCreate = () => {
    if (onCreateVersion && newVersion.version && newVersion.name && newVersion.effective_from) {
      onCreateVersion(newVersion);
      setIsCreateDialogOpen(false);
      setNewVersion({ status: 'draft' });
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Methodology Versions</CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Version
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Methodology Version</DialogTitle>
                <DialogDescription>
                  Create a new version of the assessment methodology.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="version">Version Number</Label>
                  <Input
                    id="version"
                    placeholder="e.g., 1.1.0"
                    value={newVersion.version || ''}
                    onChange={(e) => setNewVersion({ ...newVersion, version: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Q2 2024 Update"
                    value={newVersion.name || ''}
                    onChange={(e) => setNewVersion({ ...newVersion, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of this version..."
                    value={newVersion.description || ''}
                    onChange={(e) => setNewVersion({ ...newVersion, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="effective_from">Effective From</Label>
                  <Input
                    id="effective_from"
                    type="date"
                    value={newVersion.effective_from || ''}
                    onChange={(e) => setNewVersion({ ...newVersion, effective_from: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Initial Status</Label>
                  <Select
                    value={newVersion.status}
                    onValueChange={(value: any) => setNewVersion({ ...newVersion, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active (will retire current)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Create Version</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedVersions.map((version) => (
            <div
              key={version.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{version.name}</span>
                  {getStatusBadge(version.status)}
                  {version.breaking_changes && (
                    <Badge variant="destructive" className="text-xs">Breaking</Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span>Version {version.version}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Effective {new Date(version.effective_from).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {version.status === 'draft' && onActivateVersion && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onActivateVersion(version.id)}
                  >
                    Activate
                  </Button>
                )}
                {version.status === 'active' && onRetireVersion && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRetireVersion(version.id)}
                  >
                    Retire
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          {sortedVersions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No methodology versions created yet.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
