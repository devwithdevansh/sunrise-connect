import 'package:audioplayers/audioplayers.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum AppSound { click, toggle, success, pop, error }

class SoundService {
  SoundService._internal();
  static final SoundService instance = SoundService._internal();

  final Map<AppSound, AudioPlayer> _players = {};
  bool _soundEnabled = true;

  static const _soundPrefKey = 'sound_enabled';

  final Map<AppSound, String> _files = {
    AppSound.click: 'sounds/click.ogg',
    AppSound.toggle: 'sounds/toggle.ogg',
    AppSound.success: 'sounds/success.ogg',
    AppSound.pop: 'sounds/pop.ogg',
    AppSound.error: 'sounds/error.ogg',
  };

  /// Call once in main() before runApp()
  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _soundEnabled = prefs.getBool(_soundPrefKey) ?? true;

    for (final sound in AppSound.values) {
      final player = AudioPlayer(playerId: sound.name);
      await player.setPlayerMode(PlayerMode.lowLatency); // uses SoundPool on Android — near-zero lag
      await player.setSourceAsset(_files[sound]!);
      await player.setReleaseMode(ReleaseMode.stop);
      _players[sound] = player;
    }
  }

  Future<void> play(AppSound sound) async {
    if (!_soundEnabled) return;
    final player = _players[sound];
    if (player == null) return;
    
    if (player.state == PlayerState.playing) {
      await player.stop();
    }
    await player.play(AssetSource(_files[sound]!));
  }

  Future<void> setSoundEnabled(bool value) async {
    _soundEnabled = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_soundPrefKey, value);
  }

  bool get soundEnabled => _soundEnabled;

  Future<void> dispose() async {
    for (final player in _players.values) {
      await player.dispose();
    }
  }
}
