import { CheckLg } from "react-bootstrap-icons";
import "../styles/stepper.scss";

type StepperProps = {
  steps: string[];
  currentStep: number | undefined;
  onStepClick?: (index: number) => void;
};

export function Stepper({ steps, currentStep, onStepClick }: StepperProps) {
  return (
    <ul className="stepper-list">
      {steps.map((title, index) => {
        const isActive = index === currentStep;
        const isCompleted = currentStep !== undefined && index < currentStep;
        const isClickable = !!onStepClick;

        return (
          <li key={index} className="stepper-item">
            <div
              className={`stepper-item-content${isClickable ? ' stepper-item-content--clickable' : ''}`}
              onClick={() => onStepClick && onStepClick(index)}
              role={isClickable ? "button" : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onKeyDown={(e) => {
                if (isClickable && (e.key === "Enter" || e.key === " ")) {
                  onStepClick!(index);
                }
              }}
            >
              {steps.length > 1 && (
                <div className={[
                  'stepper-circle',
                  isActive ? 'stepper-circle--active' : '',
                  isCompleted ? 'stepper-circle--completed' : '',
                ].join(' ').trim()}>
                  {isCompleted ? <CheckLg size={14} /> : index + 1}
                </div>
              )}
              <div className={[
                'stepper-title',
                isActive ? 'stepper-title--active' : '',
                isCompleted ? 'stepper-title--completed' : '',
              ].join(' ').trim()}>
                {title}
              </div>
              <div className={[
                'stepper-underline',
                isActive ? 'stepper-underline--active' : '',
                isCompleted ? 'stepper-underline--completed' : '',
              ].join(' ').trim()} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
