import { InformationCircleIcon } from "@heroicons/react/solid";

import { Tooltip } from "@calcom/ui/Tooltip";

export default function InfoBadge({ content }: { content: string }) {
  return (
    <>
      <Tooltip content={content}>
        <span title={content}>
          <InformationCircleIcon className="relative top-px left-1 right-1 mt-px h-4 w-4 text-gray-500" />
        </span>
      </Tooltip>
    </>
  );
}
