import React, { useEffect } from 'react';
import { ToastMessage } from '../types';

interface ToastProps {
	toast: ToastMessage;
	onClose: (id: number) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
	useEffect(() => {
		const timeout = window.setTimeout(
			() => onClose(toast.id),
			toast.duration ?? 4000
		);
		return () => window.clearTimeout(timeout);
	}, [toast.id, toast.duration, onClose]);

	const bgColors = {
		success: 'bg-green-600',
		error: 'bg-red-600',
		info: 'bg-blue-600',
	};

	const icons = {
		success: (
			<svg
				className="w-6 h-6"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="2"
					d="M5 13l4 4L19 7"
				></path>
			</svg>
		),
		error: (
			<svg
				className="w-6 h-6"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="2"
					d="M6 18L18 6M6 6l12 12"
				></path>
			</svg>
		),
		info: (
			<svg
				className="w-6 h-6"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="2"
					d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				></path>
			</svg>
		),
	};

	return (
		<div
			className={`${
				bgColors[toast.type]
			} text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 min-w-[300px] animate-fade-in-up`}
		>
			<div className="flex-shrink-0">{icons[toast.type]}</div>
			<p className="font-medium">{toast.message}</p>
			<button
				onClick={() => onClose(toast.id)}
				className="ml-auto hover:bg-white/20 rounded-full p-1 transition-colors"
				aria-label="Fechar notificação"
			>
				<svg
					className="w-4 h-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M6 18L18 6M6 6l12 12"
					></path>
				</svg>
			</button>
		</div>
	);
};

export default Toast;
