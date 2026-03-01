import AddUser from "./AddUser";
import Button from "./Button";
import ChangePassword from "./ChangePassword";
import { Chart } from "./Chart";
import ConfirmationDialog, { UserAction } from "./ConfirmationDialog";
import Loading from "./Loading";
import ModalWrapper from "./ModalWrapper";
import Navbar from "./Navbar";
import SelectList from "./SelectList";
import Sidebar from "./Sidebar";
import Table from "./Table";
import Tabs from "./Tabs";
import Textbox from "./Textbox";
import Title from "./Title";
import UserAvatar from "./UserAvatar";
import UserInfo from "./UserInfo";

// Task related components (exported from their folder)
import TaskCard from "./task/TaskCard";
import { AddSubTask, TaskAssets, TaskColor, TaskDialog } from "./task";

export {
  AddUser,
  Button,
  ChangePassword,
  Chart,
  ConfirmationDialog, // Corrected spelling
  Loading,
  ModalWrapper,
  Navbar,
  SelectList,
  Sidebar,
  Table,
  Tabs,
  Textbox,
  Title,
  UserAction,
  UserAvatar,
  UserInfo,
  // Added for easy access
  TaskCard,
  AddSubTask,
  TaskAssets,
  TaskColor,
  TaskDialog,
};