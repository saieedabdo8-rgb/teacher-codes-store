import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import StudentLayout from '@/layouts/StudentLayout'
import AdminLayout from '@/layouts/AdminLayout'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import Home from '@/pages/student/Home'
import SectionSubjects from '@/pages/student/SectionSubjects'
import SubjectTeachers from '@/pages/student/SubjectTeachers'
import TeacherProducts from '@/pages/student/TeacherProducts'
import ProductDetail from '@/pages/student/ProductDetail'
import Purchases from '@/pages/student/Purchases'
import Profile from '@/pages/student/Profile'
import Dashboard from '@/pages/admin/Dashboard'
import SectionsPage from '@/pages/admin/SectionsPage'
import SubjectsPage from '@/pages/admin/SubjectsPage'
import TeachersPage from '@/pages/admin/TeachersPage'
import ProductsPage from '@/pages/admin/ProductsPage'
import CodesPage from '@/pages/admin/CodesPage'
import OrdersPage from '@/pages/admin/OrdersPage'
import PaymentsPage from '@/pages/admin/PaymentsPage'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Toaster position="top-center" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/" element={
              <ProtectedRoute><StudentLayout /></ProtectedRoute>
            }>
              <Route index element={<Home />} />
              <Route path="section/:sectionId" element={<SectionSubjects />} />
              <Route path="subject/:subjectId" element={<SubjectTeachers />} />
              <Route path="teacher/:teacherId" element={<TeacherProducts />} />
              <Route path="product/:productId" element={<ProductDetail />} />
              <Route path="purchases" element={<Purchases />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route path="/admin" element={
              <ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="sections" element={<SectionsPage />} />
              <Route path="subjects" element={<SubjectsPage />} />
              <Route path="teachers" element={<TeachersPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="codes" element={<CodesPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="payments" element={<PaymentsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
