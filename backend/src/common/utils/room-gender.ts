import { Gender, GenderRestriction } from '@prisma/client'

/**
 * Sinh viên có được phép đăng ký / ở loại phòng này không.
 * - Nam → chỉ `male_only`
 * - Nữ → chỉ `female_only`
 * - Khác → chỉ `mixed` (trường hợp đặc biệt, BQL có thể xử lý thủ công)
 * Loại phòng chưa gán `genderRestriction` → không cho SV tự đăng ký (phải cấu hình).
 */
export function studentGenderMatchesRoomTypeRestriction(
  studentGender: Gender | null | undefined,
  restriction: GenderRestriction | null | undefined
): boolean {
  if (!studentGender || !restriction) return false
  switch (restriction) {
    case 'male_only':
      return studentGender === 'male'
    case 'female_only':
      return studentGender === 'female'
    case 'mixed':
      return studentGender === 'other'
    default:
      return false
  }
}

/** Các giường đang có người: không được ghép khác giới trong cùng phòng. */
export function occupantsGendersAllowStudent(
  occupantGenders: (Gender | null)[],
  studentGender: Gender
): boolean {
  for (const g of occupantGenders) {
    if (g != null && g !== studentGender) return false
  }
  return true
}
