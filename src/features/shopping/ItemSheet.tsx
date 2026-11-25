import { Trash2Icon } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  STORE_SECTIONS,
  UNITS,
  type ShoppingItem,
  type StoreSection,
  type Unit,
} from "@/data/types";

export type ItemEdit = {
  customName?: string;
  amount?: number;
  unit?: Unit;
  storeSection: StoreSection;
};

type ItemSheetProps = {
  item: ShoppingItem | null;
  name: string;
  section: StoreSection;
  /** Staples are listed without an amount (#187), so the amount is not asked for. */
  isStaple: boolean;
  onSave: (edit: ItemEdit) => void;
  onDelete: () => void;
  onClose: () => void;
};

const toText = (amount?: number) =>
  amount === undefined ? "" : String(amount).replace(".", ",");
const toAmount = (text: string) => {
  const value = Number(text.trim().replace(",", "."));
  return text.trim() && Number.isFinite(value) && value > 0 ? value : undefined;
};

/** Edit one item of the shopping list (#190): name (own items), amount, section, delete. */
export function ItemSheet({
  item,
  name,
  section,
  isStaple,
  onSave,
  onDelete,
  onClose,
}: ItemSheetProps) {
  const { t } = useTranslation();
  const formId = useId();
  return (
    <BottomSheet
      open={item !== null}
      onOpenChange={(o) => (o ? undefined : onClose())}
      title={name}
      footer={
        <>
          <Button type="submit" form={formId}>
            {t("shopping.sheet.save")}
          </Button>
          <Button
            variant="ghost"
            className="text-destructive"
            onClick={onDelete}
          >
            <Trash2Icon aria-hidden />
            {t("shopping.sheet.delete")}
          </Button>
        </>
      }
    >
      {/* Keyed by item, so the form starts from the item each time the sheet opens. */}
      {item ? (
        <ItemForm
          key={item.id}
          formId={formId}
          item={item}
          section={section}
          isStaple={isStaple}
          onSave={onSave}
        />
      ) : null}
    </BottomSheet>
  );
}

function ItemForm({
  formId,
  item,
  section,
  isStaple,
  onSave,
}: {
  formId: string;
  item: ShoppingItem;
  section: StoreSection;
  isStaple: boolean;
  onSave: (edit: ItemEdit) => void;
}) {
  const { t } = useTranslation();
  const id = useId();
  const [customName, setCustomName] = useState(item.customName ?? "");
  const [amountText, setAmountText] = useState(toText(item.amount));
  const [unit, setUnit] = useState<Unit>(item.unit ?? "pcs");
  const [storeSection, setStoreSection] = useState<StoreSection>(section);

  const amount = toAmount(amountText);
  const amountInvalid = amountText.trim() !== "" && amount === undefined;

  function save() {
    if (amountInvalid) return;
    onSave({
      ...(item.customName !== undefined
        ? { customName: customName.trim() || item.customName }
        : {}),
      ...(amount !== undefined && !isStaple ? { amount, unit } : {}),
      storeSection,
    });
  }

  return (
    <form
      id={formId}
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      {item.customName !== undefined ? (
        <div className="space-y-1">
          <label htmlFor={`${id}-name`} className="text-sm font-medium">
            {t("shopping.sheet.name")}
          </label>
          <Input
            id={`${id}-name`}
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />
        </div>
      ) : null}

      {isStaple ? (
        <p className="text-sm text-muted-foreground">
          {t("shopping.sheet.stapleHint")}
        </p>
      ) : (
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <label htmlFor={`${id}-amount`} className="text-sm font-medium">
              {t("shopping.sheet.amount")}
            </label>
            <Input
              id={`${id}-amount`}
              inputMode="decimal"
              placeholder={t("shopping.sheet.noAmount")}
              value={amountText}
              aria-invalid={amountInvalid}
              onChange={(e) => setAmountText(e.target.value)}
            />
          </div>
          <div className="w-36 space-y-1">
            <label htmlFor={`${id}-unit`} className="text-sm font-medium">
              {t("shopping.sheet.unit")}
            </label>
            <NativeSelect
              id={`${id}-unit`}
              value={unit}
              onChange={(e) => setUnit(e.target.value as Unit)}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {t(`units.long.${u}`)}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor={`${id}-section`} className="text-sm font-medium">
          {t("shopping.sheet.section")}
        </label>
        <NativeSelect
          id={`${id}-section`}
          value={storeSection}
          onChange={(e) => setStoreSection(e.target.value as StoreSection)}
        >
          {STORE_SECTIONS.map((s) => (
            <option key={s} value={s}>
              {t(`storeSections.${s}`)}
            </option>
          ))}
        </NativeSelect>
        <p className="text-sm text-muted-foreground">
          {t("shopping.sheet.sectionHint")}
        </p>
      </div>
    </form>
  );
}
