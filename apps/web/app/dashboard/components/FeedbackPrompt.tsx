"use client"

import * as React from "react"
import { Sparkles, Smile, Meh, Frown, Heart, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export type FeedbackPayload = {
  rating: number
  comment: string
}

type SubmissionState = "idle" | "success" | "error"

type FeedbackPromptProps = {
  open: boolean
  submitting: boolean
  submissionState: SubmissionState
  error?: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: FeedbackPayload) => void
  onDismiss: () => void
}

const ratingLabels: Record<number, { title: string; caption: string }> = {
  1: { title: "Needs work", caption: "Nothing landed" },
  2: { title: "Room to grow", caption: "Some friction" },
  3: { title: "It’s okay", caption: "Getting there" },
  4: { title: "Pretty good", caption: "Happy overall" },
  5: { title: "Love it", caption: "It sparks joy" },
}

const ratingIcons: Record<number, React.ComponentType<{ className?: string }>> = {
  1: Frown,
  2: Meh,
  3: Smile,
  4: Star,
  5: Heart,
}

export function FeedbackPrompt({
  open,
  submitting,
  submissionState,
  error,
  onOpenChange,
  onSubmit,
  onDismiss,
}: FeedbackPromptProps) {
  const [rating, setRating] = React.useState<number | null>(null)
  const [comment, setComment] = React.useState("")

  React.useEffect(() => {
    if (!open) {
      setRating(null)
      setComment("")
    } else if (submissionState === "success") {
      setComment("")
    }
  }, [open, submissionState])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!rating || submitting) return
    onSubmit({ rating, comment: comment.trim() })
  }

  const handleDismiss = () => {
    onDismiss()
    onOpenChange(false)
  }

  const success = submissionState === "success"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-linear-to-br from-background via-background/95 to-background/90 shadow-2xl border-t border-border/80 dark:border-[#3e4451] rounded-t-3xl md:max-w-2xl md:mx-auto md:rounded-3xl md:bottom-6 md:w-[640px]"
      >
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 p-4 md:p-6"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <div className="inline-flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner shadow-primary/20">
              <Sparkles className="size-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                Quick pulse check
              </p>
              <h2 className="text-lg md:text-xl font-semibold leading-tight">
                How is the dashboard treating you today?
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Rate 1-5 and drop a quick note. It pops up once per feature
                cycle, so your answer really counts.
              </p>
            </div>
          </div>

          {success ? (
            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 px-4 py-5 dark:border-emerald-500/30 dark:bg-emerald-900/30">
              <p className="text-base font-semibold text-emerald-900 dark:text-emerald-200">
                Thanks for the insight!
              </p>
              <p className="text-sm text-emerald-800 dark:text-emerald-100/80 mt-1">
                We’ll use it to fine-tune the experience. Feel free to ping us
                again from the help menu anytime.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Select a rating
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {([1, 2, 3, 4, 5] as const).map((value) => {
                    const Icon = ratingIcons[value]
                    const selected = rating === value
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setRating(value)}
                        className={cn(
                          "rounded-2xl border border-border/70 px-3 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 dark:border-[#3e4451] hover:border-primary/60 dark:hover:border-[#4fc3f7]/60",
                          selected
                            ? "bg-primary/10 border-primary text-primary shadow-lg shadow-primary/20"
                            : "bg-background/80"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "inline-flex size-9 items-center justify-center rounded-2xl bg-muted text-muted-foreground",
                              selected &&
                                "bg-primary text-primary-foreground shadow-primary/30 shadow-md"
                            )}
                          >
                            <Icon className="size-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">
                              {ratingLabels[value].title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {ratingLabels[value].caption}
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="feedback-comment" className="text-sm font-medium">
                    Want to share more?
                  </label>
                  <span className="text-xs text-muted-foreground">Optional</span>
                </div>
                <Textarea
                  id="feedback-comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value.slice(0, 500))}
                  placeholder="Tell us what made your day or what almost did."
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {comment.length}/500
                </p>
              </div>
            </>
          )}

          {error && (
            <p
              role="alert"
              className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2"
            >
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Button
              type={success ? "button" : "submit"}
              size="lg"
              disabled={!success && (!rating || submitting)}
              className="flex-1 md:flex-none"
              onClick={success ? () => onOpenChange(false) : undefined}
            >
              {success
                ? "Close"
                : submitting
                  ? "Sending..."
                  : rating
                    ? "Share feedback"
                    : "Select a rating"}
            </Button>
            {!success && (
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                onClick={handleDismiss}
              >
                No thanks
              </button>
            )}
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

