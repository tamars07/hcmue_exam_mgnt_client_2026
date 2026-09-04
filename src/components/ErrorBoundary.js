import { Component } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Stack, Typography } from '@mui/material';

// Catches render-time errors anywhere below it in the tree so a single crashing
// component shows a recovery screen instead of a blank white page.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled render error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
          <Stack spacing={2} alignItems="center" sx={{ maxWidth: 480, textAlign: 'center' }}>
            <Typography variant="h4">Đã có lỗi xảy ra</Typography>
            <Typography color="text.secondary">Trang gặp sự cố ngoài dự kiến. Vui lòng tải lại trang.</Typography>
            <Button variant="contained" onClick={this.handleReload}>
              Tải lại trang
            </Button>
          </Stack>
        </Box>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node
};

export default ErrorBoundary;
