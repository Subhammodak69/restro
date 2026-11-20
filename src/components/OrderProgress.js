const dineInSteps = [
  ['NEW', 'Received'],
  ['ACCEPTED', 'Accepted'],
  ['PREPARING', 'Preparing'],
  ['READY', 'Ready'],
  ['SERVED', 'Served']
];

const deliverySteps = [
  ['NEW', 'Received'],
  ['ACCEPTED', 'Accepted'],
  ['PREPARING', 'Preparing'],
  ['READY', 'Ready'],
  ['ASSIGNED', 'Courier assigned'],
  ['PICKED_UP', 'Picked up'],
  ['ON_THE_WAY', 'On the way'],
  ['DELIVERED', 'Delivered']
];

const kitchenIndex = { NEW: 0, ACCEPTED: 1, PREPARING: 2, READY: 3 };
const deliveryIndex = { ASSIGNED: 4, PICKED_UP: 5, ON_THE_WAY: 6, DELIVERED: 7 };

export default function OrderProgress({ order }) {
  const isDelivery = order.orderType === 'DELIVERY' || order.order_type === 'DELIVERY';
  const steps = isDelivery ? deliverySteps : dineInSteps;
  const status = String(order.status || 'NEW').toUpperCase();

  if (status === 'CANCELLED') {
    return <p className="order-progress-cancelled">This order was cancelled.</p>;
  }

  const baseIndex = kitchenIndex[status] ?? (status === 'SERVED' ? 4 : -1);
  const courierIndex = deliveryIndex[String(order.deliveryStatus || '').toUpperCase()] ?? -1;
  const orderIndex = status === 'OUT_FOR_DELIVERY' ? 5 : status === 'DELIVERED' ? 7 : baseIndex;
  const currentIndex = isDelivery
    ? Math.max(orderIndex, baseIndex >= 3 || orderIndex >= 5 ? courierIndex : -1, 0)
    : Math.max(baseIndex, 0);
  const percent = Math.round((currentIndex / (steps.length - 1)) * 100);

  return (
    <div className="order-progress">
      <div
        className="progress-rail"
        role="progressbar"
        aria-label="Order progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <i style={{ width: `${percent}%` }} />
      </div>
      <ol className="progress-steps">
        {steps.map(([key, label], index) => (
          <li className={index < currentIndex ? 'complete' : index === currentIndex ? 'current' : ''} key={key}>
            <span>{label}</span>
          </li>
        ))}
      </ol>
      {order.deliveryStaffName && <p className="order-courier">Courier: {order.deliveryStaffName}</p>}
    </div>
  );
}
