import React from "react";
import TableWorkspace from "../core/components/module/table/container/TableWorkspace.jsx";
import { modularTable } from "../core/components/custom/table/templates/modularTable.js";

export function Workspace() {
  const tableProps = modularTable();

  return (
    <div className="h-auto">
      <div className="flex-1 flex h-[620px] mx-4 mt-4">
        <TableWorkspace tableProps={tableProps} />
      </div>
    </div>
  );
}

