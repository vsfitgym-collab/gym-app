import { createBrowserRouter, Navigate } from "react-router-dom"
import { AuthLayout } from "@/layouts/AuthLayout"
import { StudentLayout } from "@/layouts/StudentLayout"
import { PersonalLayout } from "@/layouts/PersonalLayout"

// Static imports for critical pages to avoid lazy-resolution issues
import { LoginPage } from "@/pages/auth/LoginPage"
import { RegisterPage } from "@/pages/auth/RegisterPage"
import { OnboardingPage } from "@/pages/OnboardingPage"
import { DashboardPage as StudentDashboard } from "@/pages/student/DashboardPage"
import { WorkoutExecutionPage } from "@/pages/student/WorkoutExecutionPage"
import { UpgradePage } from "@/pages/student/UpgradePage"

// Lazy load secondary pages - usando safeLazy para evitar undefined
import { safeLazy } from "@/lib/safeLazy"

const WorkoutsPage = safeLazy(() => import("@/pages/student/WorkoutsPage"))
const StudentExercisesPage = safeLazy(() => import("@/pages/student/ExercisesPage"))
const ProgressPage = safeLazy(() => import("@/pages/student/ProgressPage"))
const PlansPage = safeLazy(() => import("@/pages/student/PlansPage"))
const AchievementsPage = safeLazy(() => import("@/pages/student/AchievementsPage"))
const StudentChatPage = safeLazy(() => import("@/pages/student/RealChatPage"))
const AssistantChatPage = safeLazy(() => import("@/pages/student/AssistantChatPage"))
const StudentProfile = safeLazy(() => import("@/pages/student/ProfilePage"))

const TrainerDashboardPage = safeLazy(() => import("@/pages/trainer/DashboardPage"))
const TrainerStudentsPage = safeLazy(() => import("@/pages/trainer/StudentsPage"))
const TrainerWorkoutsPage = safeLazy(() => import("@/pages/trainer/WorkoutsPage"))
const CreateWorkoutPage = safeLazy(() => import("@/pages/trainer/CreateWorkoutPage"))
const TrainerExercisesPage = safeLazy(() => import("@/pages/trainer/ExercisesPage"))
const TrainerPlansPage = safeLazy(() => import("@/pages/trainer/PlansPage"))
const TrainerPaymentsPage = safeLazy(() => import("@/pages/trainer/PaymentsPage"))
const TrainerChatPage = safeLazy(() => import("@/pages/trainer/ChatPage"))
const TrainerAchievementsPage = safeLazy(() => import("@/pages/trainer/AchievementsPage"))
const TrainerProgressPage = safeLazy(() => import("@/pages/trainer/ProgressPage"))
const TrainerProfilePage = safeLazy(() => import("@/pages/trainer/ProfilePage"))

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <AuthLayout><LoginPage /></AuthLayout>,
  },
  {
    path: "/register",
    element: <AuthLayout><RegisterPage /></AuthLayout>,
  },
  {
    path: "/onboarding",
    element: <OnboardingPage />,
  },
  {
    path: "/dashboard",
    element: <StudentLayout><StudentDashboard /></StudentLayout>,
  },
  {
    path: "/workouts",
    element: <StudentLayout><WorkoutsPage /></StudentLayout>,
  },
  {
    path: "/workouts/:id",
    element: <WorkoutExecutionPage />,
  },
  {
    path: "/exercises",
    element: <StudentLayout><StudentExercisesPage /></StudentLayout>,
  },
  {
    path: "/progress",
    element: <StudentLayout><ProgressPage /></StudentLayout>,
  },
  {
    path: "/plans",
    element: <StudentLayout><PlansPage /></StudentLayout>,
  },
  {
    path: "/upgrade",
    element: <UpgradePage />,
  },
  {
    path: "/achievements",
    element: <StudentLayout><AchievementsPage /></StudentLayout>,
  },
  {
    path: "/aluno/chat",
    element: <StudentLayout><StudentChatPage /></StudentLayout>,
  },
  {
    path: "/aluno/assistant",
    element: <StudentLayout><AssistantChatPage /></StudentLayout>,
  },
  {
    path: "/profile",
    element: <StudentLayout><StudentProfile /></StudentLayout>,
  },
  {
    path: "/trainer",
    element: <PersonalLayout><TrainerDashboardPage /></PersonalLayout>,
  },
  {
    path: "/trainer/students",
    element: <PersonalLayout><TrainerStudentsPage /></PersonalLayout>,
  },
  {
    path: "/trainer/workouts",
    element: <PersonalLayout><TrainerWorkoutsPage /></PersonalLayout>,
  },
  {
    path: "/trainer/workouts/create",
    element: <PersonalLayout><CreateWorkoutPage /></PersonalLayout>,
  },
  {
    path: "/trainer/workouts/edit/:id",
    element: <PersonalLayout><CreateWorkoutPage /></PersonalLayout>,
  },
  {
    path: "/trainer/exercises",
    element: <PersonalLayout><TrainerExercisesPage /></PersonalLayout>,
  },
  {
    path: "/trainer/plans",
    element: <PersonalLayout><TrainerPlansPage /></PersonalLayout>,
  },
  {
    path: "/trainer/payments",
    element: <PersonalLayout><TrainerPaymentsPage /></PersonalLayout>,
  },
  {
    path: "/trainer/chat",
    element: <PersonalLayout><TrainerChatPage /></PersonalLayout>,
  },
  {
    path: "/trainer/achievements",
    element: <PersonalLayout><TrainerAchievementsPage /></PersonalLayout>,
  },
  {
    path: "/trainer/progress",
    element: <PersonalLayout><TrainerProgressPage /></PersonalLayout>,
  },
  {
    path: "/trainer/profile",
    element: <PersonalLayout><TrainerProfilePage /></PersonalLayout>,
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
])
