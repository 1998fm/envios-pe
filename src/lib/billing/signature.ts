import { WebhookSignatureValidator } from "mercadopago";
// La firma se comprueba con el ts original; solo el control de antigüedad
// normaliza unidades. Nunca modificar el texto firmado antes de verificar HMAC.
export function validarFirmaMP(
  signature: string,
  requestId: string,
  id: string,
  secret: string,
) {
  WebhookSignatureValidator.validate({
    xSignature: signature,
    xRequestId: requestId,
    dataId: id,
    secret,
  });
  const ts = signature
    .split(",")
    .map((p) => p.trim().split("="))
    .filter(([k]) => k === "ts");
  if (ts.length !== 1 || !/^\d{10}$|^\d{13}$/.test(ts[0][1] ?? ""))
    throw new Error("fecha_formato");
  const valor = ts[0][1];
  const fecha = Number(valor) * (valor.length === 10 ? 1000 : 1);
  if (!Number.isSafeInteger(fecha) || Math.abs(Date.now() - fecha) > 600000)
    throw new Error("fecha_fuera_de_plazo");
}
