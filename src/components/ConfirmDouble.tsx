import { StyleSheet, Text, View } from "react-native";
import Button from "./Button";
import Sheet from "./Sheet";
import { colors } from "../theme";

interface Props {
  visible: boolean;
  remaining: number;
  onAnswer: (isDouble: boolean) => void;
  onCancel: () => void;
}

/** Asked when a double-out finish is attempted: a total alone cannot tell us the last dart. */
export default function ConfirmDouble({ visible, remaining, onAnswer, onCancel }: Props) {
  return (
    <Sheet visible={visible} title="Uitgooien" onClose={onCancel}>
      <Text style={styles.text}>Je gooit {remaining} uit. Was de laatste dart een dubbel (of de Bull)?</Text>
      <View style={styles.row}>
        <Button label="Nee (bust)" variant="danger" onPress={() => onAnswer(false)} style={{ flex: 1 }} />
        <Button label="Ja, dubbel" onPress={() => onAnswer(true)} style={{ flex: 1 }} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  text: { color: colors.text, fontSize: 16, lineHeight: 23, marginBottom: 18 },
  row: { flexDirection: "row", gap: 12 },
});
