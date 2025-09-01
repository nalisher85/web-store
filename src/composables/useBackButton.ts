import { onMounted, onUnmounted } from "vue";
import WebApp from "@twa-dev/sdk";
import { useRouter } from "vue-router";

export function useBackButton() {
  const router = useRouter();

  onMounted(() => {
    WebApp.BackButton.show();
    WebApp.BackButton.onClick(handleBack);
  });

  onUnmounted(() => {
    WebApp.BackButton.offClick(handleBack);
    WebApp.BackButton.hide();
  });

  const handleBack = () => {
    router.back();
  };
}