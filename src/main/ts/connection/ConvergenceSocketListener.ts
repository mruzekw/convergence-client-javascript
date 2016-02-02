interface ConvergenceSocketListener {
  onMessage(message: any): void;
  onError(error: string): void;
  onClose(reason: string): void;

}

export default ConvergenceSocketListener;
