// src/components/EventModal.jsx

export default function EventModal({ event, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ textAlign: "center" }}>
        <div className="event-box">
          <div className="event-icon">{event.icon}</div>
          <div className="event-title">{event.title}</div>
          <div className="event-desc">{event.desc}</div>
        </div>
        <button className="btn" style={{ marginTop: 20 }} onClick={onClose}>
          Continue
        </button>
      </div>
    </div>
  );
}
