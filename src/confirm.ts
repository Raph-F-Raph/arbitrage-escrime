import { Alert, Platform } from 'react-native';

// Boîte de confirmation : Alert sur mobile, window.confirm sur le web (Alert.alert ne fait rien sur le web)
export function confirmAction(title: string, message: string, okLabel: string, onOk: () => void) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) onOk();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Annuler', style: 'cancel' },
    { text: okLabel, style: 'destructive', onPress: onOk },
  ]);
}
