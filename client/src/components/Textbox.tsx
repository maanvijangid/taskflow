import React from "react";
import clsx from "clsx";
import { UseFormRegisterReturn } from "react-hook-form";

interface TextboxProps {
  type: string;
  placeholder?: string;
  label?: string;
  className?: string;
  register: UseFormRegisterReturn;
  // 'name' prop ki zaroorat nahi hai agar hum use sirf register ke liye mang rahe hain
  error?: string;
}

const Textbox: React.FC<TextboxProps> = ({
  type,
  placeholder,
  label,
  className,
  register,
  error,
}) => {
  return (
    <div className='w-full flex flex-col gap-1'>
      {label && (
        <label className='text-slate-800 dark:text-gray-400 font-semibold'>
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        // {...register} apne aap name={register.name} apply kar dega
        {...register} 
        className={clsx(
          "bg-transparent px-3 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white outline-none rounded-lg w-full",
          className
        )}
      />
      {error && <span className='text-xs text-red-500 mt-0.5'>{error}</span>}
    </div>
  );
};

export default Textbox;