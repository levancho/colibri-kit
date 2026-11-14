// Declarations for src/applications.js: the application (dashboard) components.
// Each takes { model, onAction, onSubmit } like its web counterpart. Model field names are the web ones; fields
// marked "native extra" are optional additions a phone layout uses.
import type { ComponentType, ReactNode } from "react";
import type { ImageSourcePropType, StyleProp, ViewStyle } from "react-native";

type AppTone = "accent" | "ok" | "warn" | "bad" | "success" | "warning" | "danger" | "destructive";

/** What onAction receives. The web contract's element and originalEvent do not exist in React Native. */
export interface ApplicationAction<Value = unknown> {
  /** For example "navigate", "view-record", "edit-deal", "move-deal", "add-product", "open-link". */
  action: string;
  /** The id of the page, record, deal, product … the action is about. */
  id?: string;
  /** The choice that was made, where there is one: a lane id, a quantity, an agent, a status. */
  value?: Value;
  /** Only with action "checkout": the order total as a number. */
  total?: number;
}
/** What onSubmit receives. The web contract's formData, submitter, element and originalEvent do not exist here. */
export interface ApplicationSubmission<Values = Record<string, unknown>> { form: string; id?: string; values: Values }
export type ApplicationActionHandler = (event: ApplicationAction) => void;
export type ApplicationSubmitHandler<Values = Record<string, unknown>> = (event: ApplicationSubmission<Values>) => void;
/** Status word → tone, to override the built-in guesses: { Paid: "ok", "Past due": "bad" }. */
export type ApplicationStatusTones = Record<string, AppTone>;

interface ApplicationBaseProps<Model> { model: Model; onAction?: ApplicationActionHandler; style?: StyleProp<ViewStyle> }

// ---- application-shell
export interface ApplicationShellPage { id: string; title: string; description?: string; /** native extra: a text glyph; default is the first letter */ icon?: string; /** native extra */ badge?: string | number }
export interface ApplicationShellModel { brand: string; title?: string; description?: string; pages: ApplicationShellPage[]; /** native extra: a name for the portrait in the top bar */ user?: string }
export interface ApplicationShellProps extends ApplicationBaseProps<ApplicationShellModel> {
  /** The current page id (controlled). Without it the shell keeps its own, starting at defaultPage. */
  page?: string; defaultPage?: string; onPageChange?: (id: string) => void;
  /** "auto" (default): bottom tabs below 768pt, side rail from there. With more than five pages the fifth tab is "More" and opens a sheet. */
  layout?: "auto" | "tabs" | "rail";
  /** Replaces the trailing end of the top bar. */
  actions?: ReactNode;
  children?: ReactNode | ((page: string | undefined) => ReactNode);
}
export const ApplicationShell: ComponentType<ApplicationShellProps>;

// ---- application-metrics
export interface ApplicationMetric { id?: string; label: string; value: string; change?: string; /** default: read from the sign of change */ trend?: "up" | "down"; /** default: ok when up, bad when down */ tone?: AppTone; /** native extra: sparkline values, oldest first */ series?: number[] }
export interface ApplicationMetricsModel { title?: string; description?: string; items: ApplicationMetric[] }
export interface ApplicationMetricsProps extends ApplicationBaseProps<ApplicationMetricsModel> { /** Cards per row. Default 2 on a phone, up to 4 on wide screens. */ columns?: number }
/** onAction: "view-metric". */
export const ApplicationMetrics: ComponentType<ApplicationMetricsProps>;

// ---- application-chart
export interface ApplicationChartRow { label: string; values: number[] }
export interface ApplicationChartModel {
  title?: string; description?: string; rows: ApplicationChartRow[];
  /** Series names, one per entry of row.values. Default ["Visitors", "Signups"]. */
  labels?: string[];
  /** How many of the latest rows each range shows. Default [7, 14, 30]. */
  ranges?: number[]; defaultRange?: number;
  /** Suffix of the range buttons. Default "d". */
  unit?: string;
  href?: string; linkLabel?: string;
}
export interface ApplicationChartProps extends Partial<ApplicationChartModel> {
  /** The fields may be given in model or directly as props, as on the web ChartPanel. */
  model?: ApplicationChartModel; onAction?: ApplicationActionHandler;
  /** Controlled range. Without it the chart owns the selection. */
  range?: number; onRangeChange?: (range: number) => void;
  /** Height of the plot area. Default 168. */
  height?: number; style?: StyleProp<ViewStyle>;
}
/** Bars only: React Native core has no SVG, so line, area and pie charts are not drawn. onAction: "open-link" with id = href. */
export const ApplicationChart: ComponentType<ApplicationChartProps>;

// ---- application-table
export interface ApplicationTableRow { id: string; cells: string[] }
export interface ApplicationTableModel { title?: string; description?: string; columns: string[]; rows: ApplicationTableRow[]; /** native extra: column name or index shown as badges and filter chips. Default: the column called "Status". */ statusColumn?: string | number; tones?: ApplicationStatusTones }
export interface ApplicationTableProps extends ApplicationBaseProps<ApplicationTableModel> { searchable?: boolean; sortable?: boolean; /** "auto" (default): rows below 768pt, columns from there. */ layout?: "auto" | "rows" | "columns"; /** Records shown before "Show more". Default 25. */ pageSize?: number }
/** onAction: "view-record". */
export const ApplicationTable: ComponentType<ApplicationTableProps>;

// ---- application-board
export interface ApplicationDeal { id: string; company: string; value: string; owner: string; /** native extra: the next step */ next?: string }
export interface ApplicationLane { id: string; title: string; deals: ApplicationDeal[] }
export interface ApplicationBoardModel { title?: string; description?: string; lanes: ApplicationLane[] }
/** onAction: "edit-deal" when a card is pressed, "move-deal" with value = the new lane id. */
export const ApplicationBoard: ComponentType<ApplicationBaseProps<ApplicationBoardModel>>;

// ---- application-projects
export interface ApplicationProject { id: string; name: string; description?: string; /** 0 to 100 */ progress: number; /** Web image URL; not loaded here. */ image?: string; /** A local image to show instead of the placeholder. */ source?: ImageSourcePropType; status?: string; members?: string[]; tone?: AppTone }
export interface ApplicationProjectsModel { title?: string; description?: string; projects: ApplicationProject[]; tones?: ApplicationStatusTones }
/** onAction: "view-project". */
export const ApplicationProjects: ComponentType<ApplicationBaseProps<ApplicationProjectsModel>>;

// ---- application-planner
export interface ApplicationEvent { id: string; /** ISO date and time; events are ordered by it */ datetime?: string; time: string; title: string; location?: string; /** native extra: id of the day it belongs to */ day?: string; tag?: string; tone?: AppTone }
export interface ApplicationPlannerDay { id: string; /** "Mon" */ label: string; /** "2" */ day: string }
export interface ApplicationPlannerModel { title?: string; description?: string; events: ApplicationEvent[]; /** native extra: a strip of days above the agenda */ days?: ApplicationPlannerDay[]; /** The day selected at first. */ day?: string }
/** onAction: "view-event", "select-day". */
export const ApplicationPlanner: ComponentType<ApplicationBaseProps<ApplicationPlannerModel>>;

// ---- application-identity
export interface ApplicationDetail { label: string; value: string }
export interface ApplicationIdentityModel { id?: string; name: string; role?: string; image?: string; source?: ImageSourcePropType; status?: string; stats?: ApplicationDetail[]; details: ApplicationDetail[]; editLabel?: string; tones?: ApplicationStatusTones }
/** onAction: "edit-profile". */
export const ApplicationIdentity: ComponentType<ApplicationBaseProps<ApplicationIdentityModel>>;

// ---- application-products
export interface ApplicationProduct { id: string; name: string; /** The text shown: "$320". */ price: string; /** The number used for the total. */ amount: number; /** "12 available": the leading number caps the quantity. */ stock?: string; image?: string; sprite?: string; source?: ImageSourcePropType; tone?: AppTone }
export interface ApplicationProductsModel { title?: string; description?: string; products: ApplicationProduct[]; checkoutLabel?: string }
export interface ApplicationProductsProps extends ApplicationBaseProps<ApplicationProductsModel> {
  /** Controlled quantities by product id. Without it the component keeps its own. */
  quantities?: Record<string, number>; onQuantitiesChange?: (quantities: Record<string, number>) => void;
}
/** onAction: "add-product" and "remove-product" with value = quantity, "checkout" with value = quantities and total. */
export const ApplicationProducts: ComponentType<ApplicationProductsProps>;

// ---- application-receipt
export interface ApplicationReceiptItem { label: string; amount: string; detail?: string }
export interface ApplicationDetailAmount { label: string; amount: string }
export interface ApplicationReceiptModel { id?: string; title: string; description?: string; status?: string; items: ApplicationReceiptItem[]; /** native extra: sub-total lines above the total */ totals?: ApplicationDetailAmount[]; total: string; note?: string; downloadLabel?: string; tones?: ApplicationStatusTones }
/** onAction: "download-receipt". */
export const ApplicationReceipt: ComponentType<ApplicationBaseProps<ApplicationReceiptModel>>;

// ---- application-conversation
export interface ApplicationMessage { author: string; text: string; time?: string; /** Sent by the person using the app: shown on the right. */ own?: boolean }
export interface ApplicationTicket { id: string; customer: string; title: string; status: string; message?: string; /** native extra: the whole thread; default is the one message */ messages?: ApplicationMessage[]; face?: string; image?: string; source?: ImageSourcePropType }
export interface ApplicationConversationModel { tickets: ApplicationTicket[]; selected?: Partial<ApplicationTicket> & { id: string; assigned?: string }; agents?: string[]; statuses?: string[]; tones?: ApplicationStatusTones }
export interface ApplicationConversationProps extends ApplicationBaseProps<ApplicationConversationModel> { onSubmit?: ApplicationSubmitHandler<{ reply: string }> }
/** onAction: "select-ticket", "assign-ticket" and "ticket-status" (with value). onSubmit: form "reply". */
export const ApplicationConversation: ComponentType<ApplicationConversationProps>;

// ---- application-form
export type ApplicationFieldValue = string | boolean;
export interface ApplicationField {
  name: string; label: string;
  type?: "text" | "email" | "tel" | "url" | "number" | "password" | "textarea" | "checkbox" | "switch" | "select" | "radio";
  value?: ApplicationFieldValue;
  /** Default true, as on the web; false for checkbox and switch. */
  required?: boolean;
  placeholder?: string; hint?: string;
  /** Default 100 (2000 for textarea). */
  maxLength?: number; minLength?: number;
  /** A regular expression the whole value must match. */
  pattern?: string;
  /** The error shown when the field is empty or does not match pattern. */
  message?: string;
  /** For select and radio. */
  options?: Array<string | { value: string; label: string; disabled?: boolean }>;
}
export interface ApplicationFormModel { id?: string; /** Reported as form in onSubmit. Default "profile". */ form?: string; title?: string; description?: string; /** Web only: not used. */ action?: string; submitLabel?: string; resetLabel?: string; successMessage?: string; fields: ApplicationField[] }
export interface ApplicationFormProps extends ApplicationBaseProps<ApplicationFormModel> {
  /** Called only when every field is valid. */
  onSubmit?: ApplicationSubmitHandler<Record<string, ApplicationFieldValue>>;
  /** Controlled values by field name. Without them the form keeps its own draft. */
  values?: Record<string, ApplicationFieldValue>; onValuesChange?: (values: Record<string, ApplicationFieldValue>) => void;
  /** The draft resets when recordKey (default model.id) or resetKey changes. */
  recordKey?: string | number; resetKey?: string | number;
  /** No card around the form, for use inside a Sheet or Dialog. */
  bare?: boolean;
}
/** onAction: "reset-form". */
export const ApplicationForm: ComponentType<ApplicationFormProps>;

// ---- application-photo
export interface ApplicationPhotoTile { id: string; title: string; tone?: AppTone; source?: ImageSourcePropType }
export interface ApplicationPhotoModel { eyebrow?: string; title: string; description?: string; href?: string; linkLabel?: string; /** Web image URL; not loaded here. */ image?: string; imageAlt?: string; source?: ImageSourcePropType; tone?: AppTone; /** native extra: a gallery grid */ photos?: ApplicationPhotoTile[] }
export interface ApplicationPhotoProps extends ApplicationBaseProps<ApplicationPhotoModel> { /** Gallery tiles per row. Default 3. */ columns?: number }
/** onAction: "open-link" with id = href, "view-photo" with the tile id. */
export const ApplicationPhoto: ComponentType<ApplicationPhotoProps>;

// ---- application-article
export interface ApplicationArticleStep { title: string; text: string }
export interface ApplicationArticleModel { eyebrow?: string; title: string; /** "Name · detail" */ author?: string; summary?: string; /** native extra: paragraphs before the steps */ body?: string[]; steps?: ApplicationArticleStep[]; href?: string; linkLabel?: string }
/** onAction: "open-link" with id = href. */
export const ApplicationArticle: ComponentType<ApplicationBaseProps<ApplicationArticleModel>>;
