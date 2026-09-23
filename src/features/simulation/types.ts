export type ScaleDefinition = {
  id: number;
  scale_no: number;
  scale_name: string;
  station_no: number;
};

export type ScaleState = ScaleDefinition & {
  // START_JOB anında alınan değer
  startWeight: number;

  // Simülasyondaki gerçek sanal ağırlık
  processWeight: number;

  // Tartının ekranda gösterdiği değer
  currentWeight: number;

  // Başlangıç - anlık
  consumption: number;
};

export type SimulationState = "IDLE" | "RUNNING" | "COMPLETED";

export type Job = {
  workOrderNo: string;
  startedAt: string;
};

export type StartJobSignal = {
  messageType: "START_JOB";
  source: "ERP";
  workOrderNo: string;
};

export type EndJobSignal = {
  messageType: "END_JOB";
  source: "ERP";
  workOrderNo: string;
};

export type ErpSignal = StartJobSignal | EndJobSignal;

export type ScaleResult = {
  stationNo: number;
  scaleNo: number;

  startWeight: number;
  endWeight: number;

  consumption: number;
};

export type OutgoingMessage = {
  messageType: "JOB_COMPLETED";

  target: "ERP";

  workOrderNo: string;

  status: "COMPLETED";

  simulatedDurationSeconds: number;

  totalConsumption: number;

  scaleResults: ScaleResult[];
};

export type EventLevel = "INFO" | "SUCCESS" | "WARNING";

export type EventLog = {
  id: number;

  time: string;

  level: EventLevel;

  message: string;
};

export type CompletedJobRecord = OutgoingMessage & {
  id: string;

  startedAt: string;

  completedAt: string;
};
