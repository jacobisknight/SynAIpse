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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Agent name is required"),
  type: z.enum(["voice", "workflow", "data"]),
  persona: z.string().optional(),
  goals: z.string().optional(),
  triggers: z.string().optional(),
  organizationId: z.string().default("demo-org"),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAgentModal({ open, onOpenChange }: CreateAgentModalProps) {
  const [step, setStep] = useState(1);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "workflow",
      persona: "",
      goals: "",
      triggers: "",
      organizationId: "demo-org",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        ...values,
        goals: values.goals?.split("\n").filter(Boolean) || [],
        triggers: values.triggers?.split("\n").filter(Boolean) || [],
        status: "idle",
        isSubAgent: false,
      };
      
      return await apiRequest("POST", "/api/agents", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Agent created",
        description: "Your agent has been created successfully.",
      });
      onOpenChange(false);
      form.reset();
      setStep(1);
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
    createMutation.mutate(values);
  };

  const handleNext = async () => {
    const fieldsToValidate = step === 1 ? ["name", "type"] as const : [];
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="modal-create-agent">
        <DialogHeader>
          <DialogTitle>Create New Agent</DialogTitle>
          <DialogDescription>
            Deploy a new autonomous agent to your orchestration network.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center gap-2 py-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center flex-1">
              <div
                className={`h-1 w-full rounded-full ${
                  i <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            </div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agent Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Customer Support Agent"
                          {...field}
                          data-testid="input-agent-name"
                        />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for your agent
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agent Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-agent-type">
                            <SelectValue placeholder="Select agent type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="voice">Voice Agent</SelectItem>
                          <SelectItem value="workflow">Workflow Agent</SelectItem>
                          <SelectItem value="data">Data Agent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Voice agents handle conversations, workflow agents automate processes, data agents provide insights
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="persona"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Persona & Voice</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Professional, friendly, and empathetic customer service representative..."
                          className="min-h-24"
                          {...field}
                          data-testid="input-agent-persona"
                        />
                      </FormControl>
                      <FormDescription>
                        Define the personality and tone for this agent
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="goals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goals & Objectives</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter one goal per line, e.g.:&#10;Resolve customer inquiries efficiently&#10;Maintain high satisfaction scores&#10;Escalate complex issues appropriately"
                          className="min-h-24"
                          {...field}
                          data-testid="input-agent-goals"
                        />
                      </FormControl>
                      <FormDescription>
                        One goal per line
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="triggers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Triggers</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter one trigger per line, e.g.:&#10;New customer message received&#10;Ticket priority changed&#10;Response time exceeds threshold"
                          className="min-h-32"
                          {...field}
                          data-testid="input-agent-triggers"
                        />
                      </FormControl>
                      <FormDescription>
                        Events that activate this agent (one per line)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="rounded-md border p-4 space-y-2">
                  <h4 className="text-sm font-medium">Review</h4>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Name:</span> {form.watch("name")}</p>
                    <p><span className="text-muted-foreground">Type:</span> <span className="capitalize">{form.watch("type")}</span></p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  data-testid="button-back"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  data-testid="button-next"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  data-testid="button-create-submit"
                >
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Agent
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
