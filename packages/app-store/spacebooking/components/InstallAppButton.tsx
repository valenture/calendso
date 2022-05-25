import useAddAppMutation from "../../_utils/useAddAppMutation";
import { InstallAppButtonProps } from "../../types";

export default function InstallAppButton(props: InstallAppButtonProps) {
  const mutation = useAddAppMutation("spacebooking_other");

  return (
    <>
      {props.render({
        onClick() {
          mutation.mutate("");
        },
        loading: mutation.isLoading,
      })}
    </>
  );
}
