import NextAuthSessionProvider from '../../SessionProvider';
import WithdrawContent from './WithdrawContent';

export default function WithdrawPage() {
  return (
    <NextAuthSessionProvider>
      <WithdrawContent />
    </NextAuthSessionProvider>
  );
}
