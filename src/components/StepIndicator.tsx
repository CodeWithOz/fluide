import { STEPS_INFO } from '../constants';
import type { PracticeStep } from '../types';

interface StepIndicatorProps {
  currentStep: PracticeStep;
}

function getStepIndex(step: PracticeStep): number {
  switch (step) {
    case 'SELECT':
      return 1;
    case 'DRILL':
      return 2;
    case 'INTEGRATE':
      return 3;
    case 'MONOLOGUE':
      return 4;
    default:
      return 0;
  }
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const activeIndex = getStepIndex(currentStep);

  if (activeIndex === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex justify-between relative">
        {STEPS_INFO.map((step) => {
          const isActive = step.id === activeIndex;
          const isCompleted = step.id < activeIndex;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center relative z-10 w-1/4"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-french-blue text-white scale-110 shadow-lg'
                    : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? '✓' : step.id}
              </div>
              <span
                className={`text-[10px] mt-2 font-semibold uppercase tracking-wider ${isActive ? 'text-french-blue' : 'text-gray-400'}`}
              >
                {step.title}
              </span>
              <span className="text-[9px] text-gray-400">{step.time}</span>
            </div>
          );
        })}
        <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200 -z-0" />
        <div
          className="absolute top-4 left-0 h-0.5 bg-french-blue -z-0 transition-all duration-500"
          style={{ width: `${((activeIndex - 1) / 3) * 100}%` }}
        />
      </div>
    </div>
  );
}
