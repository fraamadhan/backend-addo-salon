export const dateFormatter = (reservationDate: Date | string) => {
  return reservationDate.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour12: false,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
