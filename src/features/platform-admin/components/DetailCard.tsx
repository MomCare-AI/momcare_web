import { Card, CardBody, CardHeader } from "@/shared/ui/Card";

/** A titled card holding a responsive grid of label/value pairs (`<Pair />`). */
export function DetailCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card style={{ marginBottom: 16 }}>
      <CardHeader>
        <div className="mc-card-title">{title}</div>
        {action}
      </CardHeader>
      <CardBody>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {children}
        </div>
      </CardBody>
    </Card>
  );
}
