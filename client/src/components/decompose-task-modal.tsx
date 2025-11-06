import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Cpu } from "lucide-react";
import type { Agent } from "@shared/schema";

const formSchema = z.object({
  taskDescription: z.string().min(10, "Task description must be at least 10 characters"),
});

type FormValues = z.infer<typeof formSchema>;

interface DecomposeTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent | null;
}

export function DecomposeTaskModal({ open, onOpenChange, agent }: DecomposeTaskModalProps) {
  const [subAgents, setSubAgents] = useState<Agent[]>([]);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taskDescription: "",
    },
  });

  const decomposeMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!agent) throw new Error("No agent selected");
      
      const response = await apiRequest("POST", `/api/agents/${agent.id}/decompose`, values);
      return response;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      
      setSubAgents(data.subAgents || []);
      
      toast({
        title: "Task decomposed successfully",
        description: `Created ${data.subAgents?.length || 0} sub-agents to handle the task`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    decomposeMutation.mutate(values);
  };

  const handleClose = () => {
    form.reset();
    setSubAgents([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl" data-testid="modal-decompose-task">
        <DialogHeader>
          <DialogTitle>Decompose Complex Task</DialogTitle>
          <DialogDescription>
            Use AI to break down a complex task into sub-tasks and automatically spawn specialized sub-agents
          </DialogDescription>
        </DialogHeader>

        {subAgents.length === 0 ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="taskDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complex Task Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Example: Onboard a new enterprise customer with 500 users, set up their accounts, configure permissions, and send welcome communications"
                        className="min-h-32"
                        {...field}
                        data-testid="textarea-task-description"
                      />
                    </FormControl>
                    <FormDescription>
                      Describe the complex task you want {agent?.name} to decompose and delegate to sub-agents
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={decomposeMutation.isPending}
                  data-testid="button-decompose"
                >
                  {decomposeMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Decompose & Spawn Sub-Agents
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border p-4 bg-muted/50">
              <p className="text-sm font-medium mb-2">
                ✓ Task successfully decomposed into {subAgents.length} sub-tasks
              </p>
              <p className="text-xs text-muted-foreground">
                The following autonomous sub-agents have been created:
              </p>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {subAgents.map((subAgent, idx) => (
                <div
                  key={subAgent.id}
                  className="flex items-start gap-3 p-3 rounded-md border"
                  data-testid={`subagent-${idx}`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 flex-shrink-0">
                    <Cpu className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{subAgent.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{subAgent.type} Agent</p>
                    {subAgent.goals && subAgent.goals.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">{subAgent.goals[0]}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button onClick={handleClose} data-testid="button-done">
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
