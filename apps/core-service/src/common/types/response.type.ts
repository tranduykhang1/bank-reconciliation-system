export interface SuccessResponse<T = Record<string, unknown>> {
	message: string;
	data?: T;
}
