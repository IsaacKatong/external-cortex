import type { ReactNode } from "react";
import type { Datum, DatumTag, DatumDimension } from "../../external-storage/types.js";
import { TEXT_SECONDARY, BORDER } from "../../config/colors.js";

export type DatumListProps = {
  datums: Datum[];
  datumTags: DatumTag[];
  datumDimensions: DatumDimension[];
};

export function DatumList({
  datums,
  datumTags,
  datumDimensions,
}: DatumListProps): ReactNode {
  if (datums.length === 0) {
    return <p>No datums to display.</p>;
  }

  return (
    <section>
      <h2>Datums ({datums.length})</h2>
      {datums.map((datum) => {
        const tags = datumTags
          .filter((dt) => dt.datumID === datum.id)
          .map((dt) => dt.name);
        const dimensions = datumDimensions.filter(
          (dd) => dd.datumID === datum.id
        );

        return (
          <article key={datum.id} data-testid={`datum-${datum.id}`} style={{ borderBottom: `1px solid ${BORDER}`, paddingBottom: 8, marginBottom: 8 }}>
            <pre style={{ margin: 0 }}>
              {JSON.stringify({ ...datum, tags, dimensions }, null, 2)}
            </pre>
          </article>
        );
      })}
    </section>
  );
}
