import './SectionHeading.css';

export function SectionHeading({ n, title }: { n?: string; title: string }) {
  return (
    <h2 className="ui-sechead">
      {n && <span className="ui-sechead-n">{n}</span>}
      {title}
    </h2>
  );
}
