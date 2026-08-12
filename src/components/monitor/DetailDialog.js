import React from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Grid, Typography, Box } from '@mui/material';

const DetailDialog = ({
  open,
  onClose,
  currentCard,
  answerCount,
  answerTotal,
  startAt,
  finishAt,
  expectedFinishAt,
  bonusTime,
  answerDetails
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg">
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}
      >
        <Typography variant="body1" color="primary" sx={{ marginBottom: 1, fontSize: '1.2rem' }}>
          Thí sinh: {currentCard?.fullname} | CCCD: {currentCard?.id_card_number}
        </Typography>
        <Typography variant="body1" color="error" sx={{ marginBottom: 1, fontSize: '1.5rem' }}>
          Tiến độ: {answerCount}/{answerTotal}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ padding: '32px', width: '800px', height: '600px' }}>
        <Grid container spacing={1} sx={{ my: 0.5 }}>
          <Grid item xs={5}>
            <Typography variant="h5" sx={{ marginBottom: 1 }}>
              Bắt đầu: <span style={{ color: '#c70000' }}>{startAt}</span>
            </Typography>
          </Grid>
          <Grid item xs={2}></Grid>
          <Grid item xs={5}>
            <Typography variant="h5" sx={{ marginBottom: 1 }}>
              Kết thúc dự kiến: <span style={{ color: '#c70000' }}>{expectedFinishAt}</span>
            </Typography>
          </Grid>
          <Grid item xs={5}>
            <Typography variant="h5" sx={{ marginBottom: 1 }}>
              Kết thúc: <span style={{ color: '#c70000' }}>{finishAt}</span>
            </Typography>
          </Grid>
          <Grid item xs={2}></Grid>
          <Grid item xs={5}>
            {!!bonusTime && (
              <Typography variant="h5" sx={{ marginBottom: 1 }}>
                Bù giờ: <span style={{ color: '#c70000' }}>{bonusTime} phút</span>
              </Typography>
            )}
          </Grid>
        </Grid>

        {!answerDetails ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 220 }}>
            <Typography variant="h6" color="text.secondary">
              Đang tải chi tiết bài làm...
            </Typography>
          </Box>
        ) : (
          answerDetails.map((item, index) => (
            <Grid key={index} container spacing={2} sx={{ my: 0.5 }}>
              <Grid item xs={12}>
                <Typography variant="h6" component="div">
                  <Box component="span" sx={{ color: '#000' }}>
                    Câu {item.number}:
                  </Box>{' '}
                  {item.type === 5 ? (
                    <>
                      <Box component="span" sx={{ color: 'text.secondary' }}>
                        {item.answer_summary}
                      </Box>{' '}
                      <Box component="span" sx={{ color: 'error.main' }}>
                        ({item.word_count} chữ)
                      </Box>{' '}
                      <Box component="span" sx={{ color: '#1B5E20', fontWeight: 600 }}>
                        {item.submitting_time}
                      </Box>
                    </>
                  ) : (
                    <Box component="span" sx={{ color: '#1B5E20', fontWeight: 600 }}>
                      {item.submitting_time}
                    </Box>
                  )}
                </Typography>
              </Grid>
            </Grid>
          ))
        )}
      </DialogContent>

      <DialogActions sx={{ padding: '8px' }}>
        <Button onClick={onClose} color="primary" sx={{ fontSize: '1rem', padding: '8px 16px' }}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DetailDialog;
