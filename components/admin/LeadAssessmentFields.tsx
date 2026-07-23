"use client"

import { ChevronDown } from "lucide-react"
import {
  isLeadQuestionVisible,
  leadQuestionSections,
  type LeadFormDefinition,
  type LeadQuestion,
  type LeadQuestionSection,
} from "@/lib/lead-intake"
import { cn } from "@/lib/utils"

type LeadAssessmentFieldsProps = {
  definition: LeadFormDefinition
  responses: Record<string, string>
  onChange: (key: string, value: string) => void
}

export function LeadAssessmentFields({ definition, responses, onChange }: LeadAssessmentFieldsProps) {
  return (
    <div className="space-y-5">
      {leadQuestionSections(definition).map((section) => (
        section.collapsed ? (
          <details key={section.key} className="group border border-[#c6c6c6] dark:border-[#525252]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 marker:hidden">
              <SectionIntro section={section} />
              <ChevronDown className="h-4 w-4 shrink-0 text-[#525252] transition-transform group-open:rotate-180 dark:text-[#c6c6c6]" />
            </summary>
            <QuestionGrid section={section} responses={responses} onChange={onChange} className="border-t border-[#e0e0e0] px-5 py-5 dark:border-[#393939]" />
          </details>
        ) : (
          <section key={section.key}>
            <SectionIntro section={section} />
            <QuestionGrid section={section} responses={responses} onChange={onChange} className="mt-5" />
          </section>
        )
      ))}
    </div>
  )
}

function SectionIntro({ section }: { section: LeadQuestionSection }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{section.title}</h3>
      <p className="mt-1 max-w-2xl text-xs leading-5 text-[#6f6f6f] dark:text-[#a8a8a8]">{section.summary}</p>
    </div>
  )
}

function QuestionGrid({
  section,
  responses,
  onChange,
  className,
}: {
  section: LeadQuestionSection
  responses: Record<string, string>
  onChange: (key: string, value: string) => void
  className?: string
}) {
  const visibleQuestions = section.questions.filter((question) => isLeadQuestionVisible(question, responses))

  return (
    <div className={cn("grid gap-5 md:grid-cols-2", className)}>
      {visibleQuestions.map((question) => (
        <QuestionField
          key={question.key}
          question={question}
          value={responses[question.key] || ""}
          onChange={(value) => onChange(question.key, value)}
        />
      ))}
    </div>
  )
}

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: LeadQuestion
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className={cn("block", question.type === "textarea" && "md:col-span-2")}>
      <span className="mb-2 block">
        <span className="text-sm font-medium">{question.label}{question.required ? " *" : ""}</span>
        {question.help && <span className="mt-1 block text-xs leading-5 text-[#6f6f6f] dark:text-[#a8a8a8]">{question.help}</span>}
      </span>
      {question.type === "select" ? (
        <select required={question.required} value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>
          {question.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : question.type === "textarea" ? (
        <textarea required={question.required} rows={4} value={value} onChange={(event) => onChange(event.target.value)} className={textareaClass} />
      ) : (
        <input
          type={question.type === "number" ? "number" : "text"}
          min={question.min}
          max={question.max}
          required={question.required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />
      )}
    </label>
  )
}

const inputClass = "h-11 w-full border border-[#c6c6c6] bg-white px-3 text-sm outline-none focus:border-[#0f62fe] dark:border-[#525252] dark:bg-[#161616]"
const textareaClass = "w-full border border-[#c6c6c6] bg-white px-3 py-3 text-sm outline-none focus:border-[#0f62fe] dark:border-[#525252] dark:bg-[#161616]"
