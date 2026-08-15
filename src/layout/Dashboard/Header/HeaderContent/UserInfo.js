// material-ui
import { Stack, Typography } from '@mui/material';

// project import
import useAuth from 'hooks/useAuth';

// ==============================|| HEADER CONTENT - USER INFO ||============================== //

const UserInfo = () => {
  const { user } = useAuth();

  if (!user) return null;

  const roleLabel = (user.roles || []).map((role) => user.role_descriptions?.[role] || role).join(', ');

  return (
    <Stack sx={{ ml: 1.5, textAlign: 'right' }} spacing={0}>
      <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }} noWrap>
        {user.name}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3 }} noWrap>
        {roleLabel || '—'}
      </Typography>
    </Stack>
  );
};

export default UserInfo;
