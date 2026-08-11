export interface TotpEnrollment {
  factorId: string;
  qrCode: string;
  secret: string;
}

export interface TotpFactor {
  id: string;
  createdAt: string;
}
