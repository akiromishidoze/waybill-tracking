class Waybill {
  final String id;
  final String trackingNumber;
  final String recipientName;
  final String recipientPhone;
  final String destination;
  final String status;
  final String? estimatedDelivery;
  final List<ScanEvent> events;

  Waybill({
    required this.id,
    required this.trackingNumber,
    required this.recipientName,
    required this.recipientPhone,
    required this.destination,
    required this.status,
    this.estimatedDelivery,
    this.events = const [],
  });

  factory Waybill.fromJson(Map<String, dynamic> json) {
    return Waybill(
      id: json['id'] as String,
      trackingNumber: json['trackingNumber'] as String,
      recipientName: json['recipientName'] as String,
      recipientPhone: json['recipientPhone'] as String,
      destination: json['destination'] as String,
      status: json['status'] as String,
      estimatedDelivery: json['estimatedDelivery'] as String?,
      events: (json['events'] as List<dynamic>?)
              ?.map((e) => ScanEvent.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class ScanEvent {
  final String id;
  final String status;
  final String location;
  final String timestamp;
  final String? remark;

  ScanEvent({
    required this.id,
    required this.status,
    required this.location,
    required this.timestamp,
    this.remark,
  });

  factory ScanEvent.fromJson(Map<String, dynamic> json) {
    return ScanEvent(
      id: json['id'] as String,
      status: json['status'] as String,
      location: json['location'] as String,
      timestamp: json['timestamp'] as String,
      remark: json['remark'] as String?,
    );
  }
}
