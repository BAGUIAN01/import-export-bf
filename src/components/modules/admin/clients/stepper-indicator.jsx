import React from "react";
import { Check } from "lucide-react";

export function StepIndicator({ steps, currentStep, completedSteps }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const isActive = currentStep === index;
        const isCompleted = completedSteps.includes(index);
        const StepIcon = step.icon;
        
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200
                  ${isActive 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : isCompleted 
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-muted-foreground/30 text-muted-foreground'
                  }
                `}
              >
                {isCompleted && !isActive ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <StepIcon className="h-5 w-5" />
                )}
              </div>
              <div className="mt-2 text-center">
                <div className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {step.title}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {step.description}
                </div>
              </div>
            </div>
            
            {index < steps.length - 1 && (
              <div className="flex-1 mx-4">
                <div 
                  className={`h-0.5 transition-all duration-300 ${
                    completedSteps.includes(index) ? 'bg-primary' : 'bg-muted-foreground/20'
                  }`} 
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}