import { StyleSheet } from 'react-native'

export const colors = {
  blue: '#1f4f8a',
  red: '#ba3438',
  ink: '#172033',
  muted: '#5d697d',
  canvas: '#eef3fb',
  paper: '#fbfaf6',
  white: '#ffffff',
  border: '#d7deea',
  success: '#2f6f4e',
  danger: '#b13a3d',
}

export const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    backgroundColor: colors.canvas,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  screen: {
    backgroundColor: colors.canvas,
    flex: 1,
  },
  content: {
    gap: 18,
    padding: 20,
    paddingBottom: 40,
  },
  logo: {
    alignSelf: 'center',
    height: 150,
    marginBottom: 4,
    resizeMode: 'contain',
    width: 260,
  },
  heroCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    padding: 22,
  },
  eyebrow: {
    color: colors.red,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 39,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
  },
  body: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 18,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  button: {
    alignItems: 'center',
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  primaryButton: {
    backgroundColor: colors.blue,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
  },
  dangerButton: {
    backgroundColor: colors.red,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButtonText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: 50,
    padding: 14,
  },
  label: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 8,
  },
  field: {
    gap: 6,
  },
  notice: {
    borderRadius: 14,
    padding: 14,
  },
  errorNotice: {
    backgroundColor: '#f9e5e3',
    borderColor: '#e0aaa5',
    borderWidth: 1,
  },
  successNotice: {
    backgroundColor: '#e5f2ea',
    borderColor: '#a9d5ba',
    borderWidth: 1,
  },
  noticeText: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 22,
  },
})
